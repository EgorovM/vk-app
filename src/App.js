import React from 'react';
import bridge from '@vkontakte/vk-bridge';
import { View, Panel, PanelHeader, Button, FormLayout, Input } from '@vkontakte/vkui';
import '@vkontakte/vkui/dist/vkui.css';


class App extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      ownGroupName: '',
			groupId: 0,
      otherGroupName: '',
			appId: '7375559',
			version: '5.103',
			access_token: '945b434ecae06d43b09613546f59a553909ae4ebbacf9bfbc9584f0ca02f7faf8a09afbfb8d2c093f3906',
			homeurl: 'https://egorovm.github.io/vk-app/'
    }

    this.onChange = this.onChange.bind(this);
  }

  onChange(e) {
    const { name, value } = e.currentTarget;
    this.setState({ [name]: value });
  }

	makeResponse = async(groupName, offset=0, field) => {
		try {
			const data = await bridge.send(
				'VKWebAppCallAPIMethod',
				{
					"method": "groups.getMembers",
			 		"params": {"group_id": groupName, "offset": offset, "v": this.state.version, "access_token": this.state.access_token}
				}
			);

			return data.response[field];

		} catch (error) {
			console.log('groups.getMembers', error);
		  return error;
		}
	}

	getGroupId = async(groupName) => {
		try{
			const group = await bridge.send(
				'VKWebAppCallAPIMethod',
				{
					"method": "groups.getById",
					"params": {"group_id": groupName, "v": this.state.version, "access_token": this.state.access_token}
				}
			);

			return group.response[0]['id'];
		}catch(error){
			console.log('groups.getByID', error);
			return error;
		}

	}

	membersPrepare = async (ban=true) => {
		var ownMembers = new Set();
		var membersList = new Set();

		const otherName = this.state.otherGroupName;
		const ownName = this.state.ownGroupName;

		const groupId = await this.getGroupId(ownName);

		const otherCount = await this.makeResponse(otherName, 0, 'count');
		const ownCount = await this.makeResponse(ownName, 0, 'count');

		for(var offset = 0; offset < ownCount; offset += 1000){
				var members = await this.makeResponse(ownName, offset, 'items');

				members.forEach((item, i) => {
					ownMembers.add(item);
				});
		}

		for(var offset = 0; offset < otherCount; offset += 1000){
				var members = await this.makeResponse(otherName, offset, 'items');

				members.forEach((item, i) => {
					if(ownMembers.has(item)) membersList.add(item);
				});
		}

		this.banMembers(groupId, membersList, ban);
	}

	banMembers = async (groupId, toBanList, ban) => {
		console.log(toBanList.size)
		toBanList.forEach((user_id) => {
			console.log('send', user_id);
			console.log('send', ban ? "groups.ban" : "groups.unban")

			bridge.sendPromise(
				"VKWebAppCallAPIMethod",
				{"method" : ban ? "groups.ban" : "groups.unban",
				"params" : {"group_id": groupId, "owner_id": user_id, "v": this.state.version, "access_token": this.state.access_token}}
			).then(data => {console.log('success', data)})
			.catch(error => {
				console.log(error);
				var url = `https://oauth.vk.com/authorize?client_id=${this.state.appId}&display=page&redirect_uri=https://oauth.vk.com/blank.html&scope=groups&response_type=token&v=${this.state.version}&revoke=1`
				console.log(url);
				window.open(url);
				return;
			});
		});

		console.log('успешно');
	}

  render() {
    return (
      <View activePanel="new-user">
        <Panel id="new-user">
          <PanelHeader>Vk-App</PanelHeader>
          <FormLayout>

						<Input onChange={this.onChange} value={this.state.ownGroupName} name="ownGroupName" type="text" top="Название вашей группы"/>
            <Input onChange={this.onChange} value={this.state.otherGroupName} name="otherGroupName" type="text" top="Название рассматриваемой группы"/>

						<Button onClick={this.membersPrepare} type="submit" size="xl">Забанить пересечение</Button>
						<Button onClick={this.membersPrepare} type="submit" size="xl">Разбанить пересечение</Button>

          </FormLayout>
        </Panel>
      </View>
    );
  }
}

export default App;
